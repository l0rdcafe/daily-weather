const https = require("https");
const { CronJob } = require("cron");
const chalk = require("chalk");
require("dotenv").config();

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, OPENWEATHERMAP_API_KEY } = process.env;
const client = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

function getWeather(city) {
  return new Promise((resolve, reject) => {
    https.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&APPID=${OPENWEATHERMAP_API_KEY}`,
      res => {
        const { statusCode } = res;

        if (statusCode !== 200) {
          reject(new Error("A network has occurred."));
        }

        let data = "";
        res.setEncoding("utf8");
        res.on("data", chunk => {
          data += chunk;
        });

        res.on("end", () => {
          const parsedData = JSON.parse(data);
          resolve({ max: parsedData.main.temp_max, min: parsedData.main.temp_min, desc: parsedData.weather[0].main });
        });
      }
    );
  });
}

const job = new CronJob("0 10 * * *", async () => {
  try {
    const city = process.argv[2];
    const temp = await getWeather(city);
    const weather = `Hello! Anticipating ${temp.desc.toLowerCase()} in ${city} today with a high of ${
      temp.max
    } °C and a low of ${temp.min} °C.`;

    client.messages
      .create({
        body: weather,
        from: "+15879068753",
        to: "+16477677858"
      })
      .then(msg => console.log(msg))
      .done();
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
});

async function main() {
  if (process.argv.length < 3) {
    console.log(chalk.cyan("Please provide a city to look up the weather and notify you every morning."));
    process.exit(1);
  }
  job.start();
}

main();
