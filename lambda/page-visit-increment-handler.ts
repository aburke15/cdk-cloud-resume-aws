import AWS = require('aws-sdk');
import { DynamoDB, Lambda } from 'aws-sdk';
import { APIGatewayEvent } from 'aws-lambda';

AWS.config.update({ region: 'us-west-2' });

const apiVersion = { apiVersion: '2012-08-10' };
let ddb = new DynamoDB(apiVersion);
let lambda = new AWS.Lambda({ region: 'us-west-2' });

exports.handler = async (event: APIGatewayEvent) => {
  console.log(JSON.stringify('request: ' + event, null, 2));
  if (!ddb) {
    ddb = new DynamoDB(apiVersion);
  }
  if (!lambda) {
    lambda = new Lambda();
  }

  const tableName: string = process.env.TABLE_NAME ?? 'N/A';
  const functionName: string = process.env.DOWNSTREAM ?? 'N/A';

  try {
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
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(response.Payload, null, 2),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(error, null, 2),
    };
  }
};
