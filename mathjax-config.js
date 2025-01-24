// mathjax-config.js
if (window.MathJax) {
    window.MathJax = {
        chtml: {
            fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2'
        },
        options: {
            skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'a'],
        },
        startup: {
            pageReady: () => {
                return Promise.resolve();
            }
        }
    };
}