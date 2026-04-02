import { env, projectName } from "./commons";

export function getName(name: string) {
  return `${projectName}-${env}-${name}`
}
