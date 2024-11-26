import { google } from "googleapis";
import * as config from "../cfg.json";
import { httpClient } from "./utils/httpClient";

const LOGIN_ENDPOINT = `${config.API_BASE_URL}/auth/login`;
const REGISTRATION_ENDPOINT = `${config.API_BASE_URL}/auth/registration`;
const CLIENTS_ENDPOINT = `${config.API_BASE_URL}/clients`;

type User = {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  address: string;
  city: string;
  phone: string;
  email: string;
};

type UserWithStatus = User & { status: string };
type UserStatus = {
  id: number;
  status: string;
};

const main = async () => {
  var apiToken;
  apiToken = await getAuthToken(config.API_USERNAME);
  if (!apiToken) {
    apiToken = await createUser(config.API_USERNAME);
  }
  requestLoop(apiToken);
};

const requestLoop = async (apiToken: string) => {
  let sheetCell = config.GOOGLE_SPREADSHEET_START_CELL;
  let offset = 0;
  let clients = [];
  do {
    clients = await getUsers(apiToken, config.USERS_PER_REQUEST, offset);
    const clientsStatuses = await getUsersStatuses(
      apiToken,
      clients.map((client) => client.id)
    );
    const clientsWithStatuses: UserWithStatus[] = clients.map((client) => ({
      ...client,
      status: clientsStatuses.find((status) => status.id === client.id)!.status,
    }));
    await writeToGoogleSheet(
      clientsWithStatuses,
      sheetCell.join(""),
      offset === 0
    );
    offset += config.USERS_PER_REQUEST;
    sheetCell = [sheetCell[0], (offset + 2).toString()];
  } while (clients.length === config.USERS_PER_REQUEST);
  console.log(clients.length, config.USERS_PER_REQUEST);
};

const getAuthToken = async (username: string): Promise<string | null> => {
  try {
    const response = await httpClient.post(LOGIN_ENDPOINT, {
      username,
    });
    return response.data.token;
  } catch (error: any) {
    console.error("Ошибка при получении токена:", error.message);
    return null;
  }
};

const createUser = async (username: string) => {
  try {
    const response = await httpClient.post(REGISTRATION_ENDPOINT, {
      username,
    });
    return response.data.token;
  } catch (error: any) {
    console.error("Непридвиденная ошибка:", error.message);
    process.exit(1);
  }
};

const getUsers = (
  apiToken: string,
  cpr: number,
  offset: number = 0
): Promise<User[]> => {
  return httpClient
    .get(CLIENTS_ENDPOINT, {
      headers: { Authorization: apiToken },
      params: {
        limit: cpr,
        offset,
      },
    })
    .then((res) => res.data);
};

const getUsersStatuses = (
  apiToken: string,
  userIds: number[]
): Promise<UserStatus[]> => {
  return httpClient
    .post(
      CLIENTS_ENDPOINT,
      {
        userIds,
      },
      {
        headers: {
          Authorization: apiToken,
        },
      }
    )
    .then((res) => res.data);
};

const writeToGoogleSheet = async (
  users: UserWithStatus[],
  sheetCell: string,
  useColumnNames: boolean = true
) => {
  const auth = new google.auth.GoogleAuth({
    keyFile: config.GOOGLE_API_KEY_PATH, // Замените на путь к вашему JSON с ключами
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const sheetRange = `${config.GOOGLE_SPREADSHEET_NAME}!${sheetCell}`;

  const values = [];

  if (useColumnNames) {
    values.push([
      "ID",
      "First Name",
      "Last Name",
      "Gender",
      "Address",
      "City",
      "Phone",
      "Email",
      "Status",
    ]);
  }

  values.push(
    ...users.map((client) => [
      client.id,
      client.firstName,
      client.lastName,
      client.gender,
      client.address,
      client.city,
      client.phone,
      client.email,
      client.status,
    ])
  );

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.GOOGLE_SPREADSHEET_ID,
      range: sheetRange,
      valueInputOption: "RAW",
      requestBody: { values },
    });
    console.log("Данные успешно записаны в Google-таблицу.");
  } catch (error: any) {
    console.error("Ошибка при записи в Google-таблицу:", error.message);
  }
};

main();
