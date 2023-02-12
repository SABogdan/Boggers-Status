# Boggers Status

A Node.js web application for monitoring the status of endpoints.

## Prerequisites

Before you begin, ensure you have met the following requirements:
* You have installed the latest version of [Node.js](https://nodejs.org/en/).
* You have access to a [MySQL](https://www.mysql.com/) database.

## Getting started

To get started, follow these steps:
1. Clone this repository to your local machine.
2. Install the required dependencies by running `npm install`.
3. Create a new MySQL database and import the `boggers-status.sql` file located in the root of the project directory.
4. Create a new file named `.env` in the root of the project directory with the following contents:

DB_HOST=localhost

DB_USER=root

DB_PASSWORD=

DB_DATABASE=endpoints

Update the values according to your MySQL database credentials.

5. Start the application by running `npm start`.
6. The application will be running on `http://localhost:3000/endpoint`.

## Usage

The application provides the following endpoints:
* GET `/endpoint`: Returns a list of all endpoints.
* POST `/endpoint/:name`: Adds or updates an endpoint with the specified `name`.

## Features

The application includes the following features:
* Logging using [Winston](https://github.com/winstonjs/winston).
* Automatic creation of log files with rotation using [winston-daily-rotate-file](https://github.com/winstonjs/winston-daily-rotate-file).
* IP address filtering to allow only certain IP addresses to access the endpoints.
* Automatic notification to a Discord webhook if an endpoint has not been updated for more than 5 minutes.


## Contributing

Contributions are welcome! To contribute, follow these steps:
1. Fork this repository.
2. Create a new branch.
3. Make your changes and commit them with descriptive commit messages.
4. Push your changes to your fork.
5. Create a pull request.

## License

Boggers Status © 2023 by Bogdan Stefanescu is licensed under CC BY-NC-SA 4.0. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-sa/4.0/
