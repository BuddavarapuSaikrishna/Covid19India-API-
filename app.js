const express = require("express"); //express

const path = require("path"); //path

const { open } = require("sqlite"); //open method sqlite

const sqlite3 = require("sqlite3"); //sqlite3

const app = express(); //app

app.use(express.json()); //middleware

const dbPath = path.join(__dirname, "covid19India.db"); // database Path

let database = null; //database variable

const initializationDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(5000, () => console.log("app is running in the port 5000"));
  } catch (e) {
    console.log(`DB ERROR ${e.message}`);
    process.exit(1);
  }
};

initializationDBAndServer();

const ConvertStatesDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const ConvertDistrictsDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//states using get method

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
      *
    FROM
      state;`;
  const statesArray = await database.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) =>
      ConvertStatesDbObjectToResponseObject(eachState)
    )
  );
});

//Getting Id by states using stateId by Get Method

app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const dbStateQueryId = `SELECT * FROM state WHERE state_id = ${stateId}`;

  const Get_state_Id = await database.get(dbStateQueryId);

  response.send(ConvertStatesDbObjectToResponseObject(Get_state_Id));
});

//District table using Get all districts

app.get("/districts/", async (request, response) => {
  const dbDistrictQuery = `SELECT * FROM district`;

  const All_districts = await database.all(dbDistrictQuery);

  response.send(All_districts);
});

//District table Getting districts using Get method

app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;

  const dbDistrictQueryId = `SELECT * FROM district WHERE district_id = ${districtId}`;

  const All_districtsId = await database.get(dbDistrictQueryId);

  response.send(ConvertDistrictsDbObjectToResponseObject(All_districtsId));
});

//Districts table update by Post method

app.post("/districts/", async (request, response) => {
  const {
    stateId,
    districtName,
    districtId,
    cases,
    cured,
    active,
    deaths,
  } = request.body;

  const dbDistrictInsertQuery = `INSERT INTO district(state_id, district_name,  cases, cured, active, deaths)
  VALUES(${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths}) `;

  await database.run(dbDistrictInsertQuery);

  response.send("District Successfully Added");
});

//District  using Delete method  By Id

app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;

  const dbDistrictDeleteQuery = `DELETE   FROM district WHERE district_id = ${districtId}`;

  await database.run(dbDistrictDeleteQuery);

  response.send("District Removed");
});

//District table using PUT method

app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const { stateId, districtName, cases, cured, active, deaths } = request.body;

  const dbDistrictUpdateQuery = `
    UPDATE district SET  
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE district_id = ${districtId}`;

  await database.run(dbDistrictUpdateQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id=${stateId};`;
  const stats = await database.get(getStateStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`;
  const state = await database.get(getStateNameQuery);
  response.send({ stateName: state.state_name });
});

module.exports = app;
