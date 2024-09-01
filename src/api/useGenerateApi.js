/* Ultra lightweight Github REST Client 
    from: https://gist.github.com/DavidWells/93535d7d6bec3a7219778ebcfa437df3 
*/

import fs from "fs";
import fetch from "node-fetch";

export function useGenerateApi(baseUrl, defaults = {}) {
    const callable = () => {};
    callable.url = baseUrl;
    return new Proxy(callable, {
        get({ url }, propKey) {
            const method = propKey.toUpperCase();
            if (["GET", "POST", "PUT", "DELETE", "PATCH", "FILE", "PFILE"].includes(method)) {
                return (data, overrides = {}) => {
                    const payload = { method, ...defaults, ...overrides };
                    switch (method) {
                        case "GET": {
                            if (data) url = `${url}?${new URLSearchParams(data)}`;
                                break;
                        }
                        case "POST":
                        case "PUT":
                        case "PATCH": {
                            payload.body = JSON.stringify(data);
                        }
                        case "PFILE": {
                            const filePath = data;
                            const fileStream = fs.createReadStream(filePath);
                            payload.method = "POST";
                            payload.body = fileStream;
                            payload.headers = {
                                ...payload.headers,
                                "Content-Type": "application/zip",
                            };
                            break;
                        }
                    }

                    // If the method is FILE, change the method to GET and return the body
                    if(method === "FILE") {
                        payload.method = "GET";
                        return fetch(url, payload)
                            .then(async response => {
                                // If the response is not OK, reject the promise with the status text
                                if (!response.ok) {
                                    var error = await response.text()
                                    return Promise.reject(error)
                                }
                                
                                // If the response is OK, return the body
                                return Promise.resolve(response.body)
                            })
                    }
                    
                    return fetch(url, payload)
                        .then(async response => {
                            // If the response is not OK, reject the promise with the status text
                            if (!response.ok) {
                                var error = await response.text()
                                return Promise.reject(error)
                            }
                            
                            // If the response is OK, parse it as text and return it
                            return response.text()
                        })
                        .then(text => {
                            // Try to parse the response as JSON, if it fails, return the text
                            try {
                                return JSON.parse(text)
                            } catch(err) {
                                return text
                            }
                        })
                };
            }

            return useGenerateApi(`${url}/${propKey}`, defaults);
        },
    });
}