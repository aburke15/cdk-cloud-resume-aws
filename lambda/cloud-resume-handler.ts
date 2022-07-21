import AWS = require('aws-sdk');
import { DynamoDB } from 'aws-sdk';
import { APIGatewayEvent } from 'aws-lambda';

AWS.config.update({ region: 'us-west-2' });

const apiVersion = { apiVersion: '2012-08-10' };
let ddb = new DynamoDB(apiVersion);

exports.handler = async (event: APIGatewayEvent) => {
  if (!ddb) {
    ddb = new DynamoDB(apiVersion);
  }

  const tableName: string = process.env.TABLE_NAME ?? 'N/A';
  const result = await ddb
    .updateItem({
      TableName: tableName,
      Key: { id: { N: '1' } },
      UpdateExpression: 'ADD visit_count :incr',
      ExpressionAttributeValues: { ':incr': { N: '1' } },
    })
    .promise();

  console.log(result);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain' },
    body: 'Hit the lambda!',
  };
};
