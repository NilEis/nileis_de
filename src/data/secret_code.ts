import { generate } from "generate-passphrase";

export const secret_code = generate({
    length: 4,
    separator: "_",
  });