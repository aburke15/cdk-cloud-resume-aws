import { APIGatewayEvent } from 'aws-lambda';

import { DynamoDB } from 'aws-sdk';
import { ScanInput } from 'aws-sdk/clients/dynamodb';

const apiVersion = { apiVersion: '2012-08-10' };
let ddb = new DynamoDB(apiVersion);

exports.handler = async (event: APIGatewayEvent) => {
  console.log(JSON.stringify('request: ' + event, null, 2));

  if (!ddb) {
    ddb = new DynamoDB(apiVersion);
  }

  const result = await readFromDynamoDB(ddb);
  const response = { count: 0 };

  result?.Items?.forEach((item) => {
    response.count = parseInt(item.visit_count.N ?? '1');
  });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain' },
    body: response,
  };
};

const readFromDynamoDB = (ddb: DynamoDB) => {
  const tableName: string = process.env.TABLE_NAME ?? 'N/A';
  const params: ScanInput = {
    TableName: tableName,
  };

  return ddb.scan(params).promise();
};
