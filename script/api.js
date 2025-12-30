import 'dotenv/config';
require('dotenv').config();
import express from 'express';

const app = express();
app.use(express.json())


const url = '**';
const company = USER_COMPANY;
const user = USER_EMAIL;
const password = USER_PSWD; 