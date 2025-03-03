const express = require("express");
const app = express();
const cors = require("cors");
const { cors, helmet, limiter } = require("./startup/security");

app.use(helmet);
app.use(limiter);
app.use(cors(cors));

require("./startup/routes")(app);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
