import type {APIRoute} from 'astro';

import {apodData} from './v1/nasa/apod/apod';

const ApiDocString: string =
    `openapi: 3.1.0
info:
  title: nileis.de - OpenAPI 3.1
  description: |-
    Some API calls I added
  contact:
    email: api@nileis.de
  version: 1.0.0
servers:
  - url: https://nileis.de/api/v1
tags:
  - name: db
    description: Some database operations
  - name: nasa
    description: some stuff with the nasa api
  - name: various
    description: calls that dont fit the other categories
  - name: pingpong
    description: ping pong
paths:
  /db/count:
    get:
      summary: Returns the number of visits to the main page
      tags:
        - db
      responses:
        '200':
          description: successful operation
          content:
            text/plain:
              example: 42
    post:
      summary: Increments the visit count
      tags:
        - db
      responses:
        '200':
          description: successful operation
  /url:
    get:
      summary: Returns the hostname that was used to call this api
      tags: 
        - various
      description: Returns the hostname
      operationId: getUrl
      responses:
        '200':
          description: successful operation
          content:
            text/plain:
              example: https://nileis.de
  /{ping_pong}:
    get:
      summary: Respond with the opposite of "ping" or "pong"
      tags:
        - pingpong
      parameters:
      - name: ping_pong
        in: path
        required: true
        description: Input value. When \`ping\` the response is \`pong\`; when \`pong\` the response is \`ping\`.
        schema:
          type: string
          enum: ['ping', 'pong']
      responses:
        "200":
          description: Successful response
          content:
            text/plain:
              schema:
                type: string
                description: Plain text containing the opposite word.
              examples:
                ping_text:
                  value: "pong"
                pong_text:
                  value: "ping"
  /{type}/{ping_pong}:
    get:
      summary: Respond with the opposite of "ping" or "pong"
      tags:
        - pingpong
      parameters:
      - name: type
        in: path
        required: true
        description: Response format.
        schema:
          type: string
          enum: ['text', 'json', 'html']
      - name: ping_pong
        in: path
        required: true
        description: Input value. When \`ping\` the response is \`pong\`; when \`pong\` the response is \`ping\`.
        schema:
          type: string
          enum: ['ping', 'pong']
      responses:
        "200":
          description: Successful response (content varies with \`type\`)
          content:
            application/json:
              schema:
                type: object
                description: A JSON object whose value is the answer to the request
              examples:
                ping_json:
                  value:
                    value: "pong"
                pong_json:
                  value:
                    value: "ping"
            text/plain:
              schema:
                type: string
                description: Plain text containing the opposite word.
              examples:
                ping_text:
                  value: "pong"
                pong_text:
                  value: "ping"
            text/html:
              schema:
                type: string
                description: HTML containing the opposite word.
              examples:
                ping_html:
                  value: "<p>pong</p>"
                pong_html:
                  value: "<p>ping</p>"
  /nasa/apod/pictures:
    get:
      summary: Gets the max image id
      tags:
        - nasa
      responses:
        "200":
          description: Successful response
          content:
            application/json:
              schema:
                type: number
                description: A JSON object whose single key is the opposite word with boolean true.
              example: REPLACE_MAX_APOD_ID_REPLACE
  /nasa/apod/apod:
    get:
      summary: Gets all images encoded
      tags:
        - nasa
      responses:
        "200":
          description: Successful response
          content:
            application/json: 
              schema:
                type: string
                description: the images as an encoded json array
  /nasa/apod/{id}:
    get:
      summary: Get encoded APOD picture by index
      description: Returns the encoded image. The server statically generates paths for every index from \`0\` to \`REPLACE_MAX_APOD_ID_REPLACE\`.
      tags:
        - nasa
      parameters:
        - name: id
          in: path
          required: true
          description: id of the image.
          schema:
            type: integer
            minimum: 0
            maximum: REPLACE_MAX_APOD_ID_REPLACE
      responses:
        '200':
          description: Encoded APOD data (array of numbers).
          content:
            application/json:
              schema:
                type: array
                items:
                  type: number
              examples:
                example:
                  value: [1,123,1,34,1,100,1,97,1,116,1,101,1,34,1,58,1,34,1,50,1,48,1,49,1,48,1,45,1,48,1,52,1,45,1,49,1,56,1,34,1,44,1,34,1,101,1,120,1,112,1,108,1,97,1,110,1,97,1,116,1,105,1,111,1,110,1,34,1,58,1,34,1,87,1,104,1,97,1,116,1,39,1,115,1,32,1,104,1,97,2,112,1,101,1,110,1,101,1,100,1,32,1,116,1,111,1,32,1,111,1,117,1,114,1,32,1,83,1,117,1,110,1,63,2,32,1,76,1,97,1,115,1,116,1,32,1,119,2,101,1,107,1,44,1,32,1,105,1,116,1,32,1,112,1,114,1,111,1,100,1,117,1,99,1,101,1,100,1,32,1,111,1,110,1,101,1,32,1,111,1,102,1,32,1,116,1,104,1,101,1,32,1,108,1,97,1,114,1,103,1,101,1,115,1,116,1,32,1,101,1,114,1,117,1,112,1,116,1,105,1,118,1,101,1,32,1,112,1,114,1,111,1,109,1,105,1,110,1,101,1,110,1,99,1,101,1,115,1,32,1,101,1,118,1,101,1,114,1,32,1,115,2,101,1,110,1,46,1,32,1,80,1,105,1,99,1,116,1,117,1,114,1,101,1,100,1,32,1,97,1,98,1,111,1,118,1,101,1,44,1,32,1,116,1,104,1,101,1,32,1,112,1,114,1,111,1,109,1,105,1,110,1,101,1,110,1,99,1,101,1,32,1,101,1,114,1,117,1,112,1,116,1,101,1,100,1,32,1,105,1,110,1,32,1,111,1,110,1,108,1,121,1,32,1,97,1,32,1,102,1,101,1,119,1,32,1,104,1,111,1,117,1,114,1,115,1,32,1,97,1,110,1,100,1,32,1,119,1,97,1,115,1,32,1,99,1,97,1,112,1,116,1,117,1,114,1,101,1,100,1,32,1,105,1,110,1,32,1,109,1,111,1,118,1,105,1,101,1,32,1,102,1,111,1,114,1,109,1,32,1,98,1,121,1,32,1,78,1,65,1,83,1,65,1,39,1,115,1,32,1,116,1,119,1,105,1,110,1,32,1,83,1,117,1,110,1,45,1,111,1,114,1,98,1,105,1,116,1,105,1,110,1,103,1,32,1,83,1,84,1,69,1,82,1,69,1,79,1,32,1,115,1,97,1,116,1,101,2,108,1,105,1,116,1,101,1,115,1,46,2,32,1,65,1,32,1,113,1,117,1,105,1,101,1,115,1,99,1,101,1,110,1,116,1,32,1,115,1,111,1,108,1,97,1,114,1,32,1,112,1,114,1,111,1,109,1,105,1,110,1,101,1,110,1,99,1,101,1,32,1,105,1,115,1,32,1,97,1,32,1,99,1,108,1,111,1,117,1,100,1,32,1,111,1,102,1,32,1,104,1,111,1,116,1,32,1,115,1,111,1,108,1,97,1,114,1,32,1,103,1,97,1,115,1,32,1,104,1,101,1,108,1,100,1,32,1,97,1,98,1,111,1,118,1,101,1,32,1,116,1,104,1,101,1,32,1,83,1,117,1,110,1,39,1,115,1,32,1,115,1,117,1,114,1,102,1,97,1,99,1,101,1,32,1,98,1,121,1,32,1,116,1,104,1,101,1,32,1,83,1,117,1,110,1,39,1,115,1,32,1,109,1,97,1,103,1,110,1,101,1,116,1,105,1,99,1,32,1,102,1,105,1,101,1,108,1,100,1,46,2,32,1,85,1,110,1,112,1,114,1,101,1,100,1,105,1,99,1,116,1,97,1,98,1,108,1,121,1,44,1,32,1,104,1,111,1,119,1,101,1,118,1,101,1,114,1,44,1,32,1,112,1,114,1,111,1,109,1,105,1,110,1,101,1,110,1,99,1,101,1,115,1,32,1,109,1,97,1,121,1,32,1,101,1,114,1,117,1,112,1,116,1,44,3,32,1,101,1,120,1,112,1,101,2,108,1,105,1,110,1,103,1,32,1,104,1,111,1,116,1,32,1,103,1,97,1,115,1,32,1,105,1,110,1,116,1,111,1,32,1,116,1,104,1,101,1,32,1,83,1,111,1,108,1,97,1,114,1,32,1,83,1,121,1,115,1,116,1,101,1,109,1,32,1,118,1,105,1,97,1,32,1,97,2,32,1,67,1,111,1,114,1,111,1,110,1,97,1,108,1,32,1,77,1,97,2,115,1,32,1,69,1,106,1,101,1,99,1,116,1,105,1,111,1,110,1,32,1,40,1,67,1,77,1,69,1,41,1,46,1,32,1,65,1,115,1,32,1,112,1,105,1,99,1,116,1,117,1,114,1,101,1,100,1,32,1,97,1,98,1,111,1,118,1,101,1,44,1,32,1,109,1,97,1,110,1,121,1,32,1,69,1,97,1,114,1,116,1,104,1,115,1,32,1,119,1,111,1,117,1,108,1,100,1,32,1,101,1,97,1,115,1,105,1,108,1,121,1,32,1,102,1,105,1,116,1,32,1,117,1,110,1,100,1,101,1,114,1,32,1,116,1,104,1,101,1,32,1,101,1,120,1,112,1,97,1,110,1,100,1,105,1,110,1,103,1,32,1,114,1,105,2,98,1,111,1,110,1,32,1,111,1,102,1,32,1,104,1,111,1,116,1,32,1,103,1,97,1,115,1,46,2,32,1,65,1,108,1,116,1,104,1,111,1,117,1,103,1,104,1,32,1,115,1,111,1,109,1,101,1,104,1,111,1,119,1,32,1,114,1,101,1,108,1,97,1,116,1,101,1,100,1,32,1,116,1,111,1,32,1,116,1,104,1,101,1,32,1,83,1,117,1,110,1,39,1,115,1,32,1,99,1,104,1,97,1,110,1,103,1,105,1,110,1,103,1,32,1,109,1,97,1,103,1,110,1,101,1,116,1,105,1,99,1,32,1,102,1,105,1,101,1,108,1,100,1,44,1,32,1,116,1,104,1,101,1,32,1,101,1,110,1,101,1,114,1,103,1,121,1,32,1,109,1,101,1,99,1,104,1,97,1,110,1,105,1,115,1,109,1,32,1,116,1,104,1,97,1,116,1,32,1,99,1,114,1,101,1,97,1,116,1,101,1,115,1,32,1,97,1,110,1,100,1,32,1,115,1,117,1,115,1,116,1,97,1,105,1,110,1,115,1,32,1,97,1,32,1,83,1,111,1,108,1,97,1,114,1,32,1,112,1,114,1,111,1,109,1,105,1,110,1,101,1,110,1,99,1,101,1,32,1,105,1,115,1,32,1,115,1,116,1,105,2,108,1,32,1,97,1,32,1,116,1,111,1,112,1,105,1,99,1,32,1,111,1,102,1,32,1,114,1,101,1,115,1,101,1,97,1,114,1,99,1,104,1,46,1,34,1,44,1,34,1,104,1,100,1,117,1,114,1,108,1,34,1,58,1,34,1,104,2,116,1,112,1,115,1,58,2,47,1,97,1,112,1,111,1,100,1,46,1,110,1,97,1,115,1,97,1,46,1,103,1,111,1,118,1,47,1,97,1,112,1,111,1,100,1,47,1,105,1,109,1,97,1,103,1,101,1,47,1,49,2,48,1,52,1,47,1,103,1,114,1,97,1,110,1,100,1,112,1,114,1,111,1,109,1,95,1,115,1,116,1,101,1,114,1,101,1,111,1,95,1,98,1,105,1,103,1,46,1,106,1,112,1,103,1,34,1,44,1,34,1,109,1,101,1,100,1,105,1,97,1,95,1,116,1,121,1,112,1,101,1,34,1,58,1,34,1,105,1,109,1,97,1,103,1,101,1,34,1,44,1,34,1,115,1,101,1,114,1,118,1,105,1,99,1,101,1,95,1,118,1,101,1,114,1,115,1,105,1,111,1,110,1,34,1,58,1,34,1,118,1,49,1,34,1,44,1,34,1,116,1,105,1,116,1,108,1,101,1,34,1,58,1,34,1,76,1,97,1,114,1,103,1,101,1,32,1,69,1,114,1,117,1,112,1,116,1,105,1,118,1,101,1,32,1,80,1,114,1,111,1,109,1,105,1,110,1,101,1,110,1,99,1,101,1,32,1,73,1,109,1,97,1,103,1,101,1,100,1,32,1,98,1,121,1,32,1,83,1,84,1,69,1,82,1,69,1,79,1,34,1,44,1,34,1,117,1,114,1,108,1,34,1,58,1,34,1,104,2,116,1,112,1,115,1,58,2,47,1,97,1,112,1,111,1,100,1,46,1,110,1,97,1,115,1,97,1,46,1,103,1,111,1,118,1,47,1,97,1,112,1,111,1,100,1,47,1,105,1,109,1,97,1,103,1,101,1,47,1,49,2,48,1,52,1,47,1,103,1,114,1,97,1,110,1,100,1,112,1,114,1,111,1,109,1,95,1,115,1,116,1,101,1,114,1,101,1,111,1,46,1,106,1,112,1,103,1,34,1,125]
        '404':
          description: Not Found — no APOD entry exists at the requested index.`
        .replaceAll('REPLACE_MAX_APOD_ID_REPLACE', String(apodData.length - 1));

export const GET: APIRoute = () => {
  return new Response(ApiDocString, {headers: {'Content-Type': 'text/plain'}});
};