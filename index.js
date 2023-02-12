import express from 'express';
import mysql from 'mysql2/promise';
import axios from 'axios';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import dotenv from 'dotenv';

dotenv.config();

const { createLogger, format, transports } = winston;
const { combine, timestamp, label, printf } = format;

// Create a custom format for the logs
const customFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Create the logger
const logger = createLogger({
  format: combine(
    timestamp(),
    customFormat
  ),
  transports: [
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '5m',
      maxFiles: '7d'
    })
  ]
});

const allowedIps = ['::1', 'localhost', ' 82.78.117.102'];

const app = express();
const port = 3000;
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
  
app.get('/endpoint', async (req, res) => {
  const connection = await pool.getConnection();
  const [rows] = await connection.query('SELECT * FROM endpoints');
  connection.release();
  res.send(rows);
});

app.post('/endpoint/:name', async (req, res) => {
  const endpoint = req.params.name;
  const ipAddress = req.connection.remoteAddress;
  const updateTimestamp = new Date();
  const connection = await pool.getConnection();

  logger.info(`Received request for endpoint: ${endpoint}`);

  if (!allowedIps.includes(req.connection.remoteAddress)) {
    logger.error(`Rejected request from unallowed IP: ${req.connection.remoteAddress}`);
    await connection.query('INSERT INTO endpoint_updates (ip_address, update_timestamp, reason) VALUES (?,?,?)', [ipAddress, updateTimestamp, 'Rejected request from unallowed IP for endpoint = ' + endpoint]);
    res.sendStatus(401);
    return;
  }

  // Check if the endpoint exists in the database
  const [rows] = await connection.query('SELECT * FROM endpoints WHERE name = ?', [endpoint]);
  if (rows.length === 0) {
  // The endpoint does not exist, insert it into the database
      logger.info(`Endpoint ${endpoint} does not exist, inserting into the database`);
      const [result] = await connection.query('INSERT INTO endpoints (name, last_updated) VALUES (?,?)', [endpoint, updateTimestamp]);
      const endpointId = result.insertId;
      await connection.query('INSERT INTO endpoint_updates (endpoint_id, ip_address, update_timestamp, reason) VALUES (?,?,?,?)', [endpointId, ipAddress, updateTimestamp, 'Endpoint created']);
      connection.release();
      if (result.affectedRows === 1) {
          res.send(`Endpoint ${endpoint} inserted into the database`);
      } else {
          logger.error(`Failed to insert endpoint ${endpoint} into the database`);
          res.sendStatus(500);
      }
  } else {
  // The endpoint exists, update the last_updated time
      logger.info(`Endpoint ${endpoint} exists, updating last_updated time`);
      const [result] = await connection.query('UPDATE endpoints SET last_updated = ? WHERE name = ?', [updateTimestamp, endpoint]);
      const endpointId = rows[0].id;
      await connection.query('INSERT INTO endpoint_updates (endpoint_id, ip_address, update_timestamp, reason) VALUES (?,?,?,?)', [endpointId, ipAddress, updateTimestamp, 'Endpoint updated']);
      connection.release();
      if (result.affectedRows === 1) {
          res.send(`Endpoint ${endpoint} last_updated time updated`);
      } else {
          logger.error(`Failed to update last_updated time for endpoint ${endpoint}`);
          res.sendStatus(500);
      }
  }
});

app.listen(port, () => {
    logger.info(`Example app listening at http://localhost:${port}`);
    console.log(`Example app listening at http://localhost:${port}`);
});

setInterval(async () => {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM endpoints');
    connection.release();
    rows.forEach((endpoint) => {
      const lastUpdated = endpoint.last_updated;
      const timeSinceLastUpdate = Date.now() - lastUpdated.getTime();
      const minutesSinceLastUpdate = Math.round(timeSinceLastUpdate / 1000 / 60);
      if (timeSinceLastUpdate > 200000) {
        logger.error(`Endpoint ${endpoint.name} hasn't been updated in ${minutesSinceLastUpdate} minutes`);
        axios.post(process.env.DISCORD_WEBHOOK, {
            embeds: [{
              title: "Endpoint Update Alert",
              color: 0xff0000,
              description: `Endpoint ${endpoint.name} hasn't been updated in ${minutesSinceLastUpdate} minutes`,
            }],
          })          
        .catch((error) => {
          logger.error(`Failed to post to Discord: ${error}`);
        });
      }
    });
  }, 200000);