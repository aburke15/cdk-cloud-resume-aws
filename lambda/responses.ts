export type FunctionResponse<TResponse> = {
  statusCode: number;
  headers: {};
  body: TResponse;
};

export type PageVisitCountResponse = {
  count: number;
};
