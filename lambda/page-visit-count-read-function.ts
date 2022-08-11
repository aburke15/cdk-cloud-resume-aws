import * as AWS from 'aws-sdk';
import { APIGatewayEvent } from 'aws-lambda';
import { PageVisitCountResponse, FunctionResponse } from '../lib/common/responses';

const apiVersion = { apiVersion: '2012-08-10' };
let ddb = new AWS.DynamoDB(apiVersion);

const tableName: string = process.env.TABLE_NAME as string;
const params: AWS.DynamoDB.ScanInput = {
  TableName: tableName,
};

exports.handler = async (event: APIGatewayEvent) => {
  console.log(JSON.stringify(event, null, 2));

  try {
    if (!ddb) {
      ddb = new AWS.DynamoDB(apiVersion);
    }

    const result = await readFromDynamoDB(ddb);
    const response: PageVisitCountResponse = { count: 0 };

    result?.Items?.forEach((item) => {
      response.count = parseInt(item.visit_count.N ?? '1');
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/plain' },
      body: response,
    } as FunctionResponse<PageVisitCountResponse>;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const readFromDynamoDB = (ddb: AWS.DynamoDB) => {
  return ddb.scan(params).promise();
};
