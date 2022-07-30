import * as AWS from 'aws-sdk';
import { APIGatewayEvent } from 'aws-lambda';
import { FunctionResponse } from './responses';

AWS.config.update({ region: 'us-west-2' });
const apiVersion = { apiVersion: '2012-08-10' };

let ddb = new AWS.DynamoDB(apiVersion);
let lambda = new AWS.Lambda();

const headers = {
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
} as const;

const tableName: string = process.env.TABLE_NAME as string;
const functionName: string = process.env.DOWNSTREAM as string;

exports.handler = async (event: APIGatewayEvent) => {
  console.log(JSON.stringify(event, null, 2));

  try {
    if (!ddb) {
      ddb = new AWS.DynamoDB(apiVersion);
    }
    if (!lambda) {
      lambda = new AWS.Lambda();
    }

    await ddb
      .updateItem({
        TableName: tableName,
        Key: { id: { N: '1' } },
        UpdateExpression: 'ADD visit_count :incr',
        ExpressionAttributeValues: { ':incr': { N: '1' } },
      })
      .promise();

    const response = await lambda
      .invoke({
        FunctionName: functionName,
        Payload: JSON.stringify(event, null, 2),
      })
      .promise();

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify(response?.Payload, null, 2),
    } as FunctionResponse<string>;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
