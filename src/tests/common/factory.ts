
export const test_packages = {
    id:"flux-pack-test",
    css: [
        ['.some_class', 
          ['color', 'blue']
        ],
        ['.some_class:hover', 
          ['color', 'red']
        ]
    ],
    requirements: [
        { type: "javascript",
           name: "rxjs"
        },
        { type: "javascript-internal",
          id:"dummy-js-internal",
        },
        { type: "javascript-external",
          id:"dummy-js-external",
        },
        { type: "css",
          id:"dummy-css",
        }
    ],
    modules:{},
    plugins:{}
     
}