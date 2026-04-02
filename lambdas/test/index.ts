import { type Event, LambdaClient } from "@aws-sdk/client-lambda"
import { sum } from "./utils"
import path from "node:path";

export const handler = async (event: Event, context: number) => {
  sum()
  console.log(path);

  new LambdaClient()
  return {
    statusCode: 200,
    message: 'success'
  }
}
