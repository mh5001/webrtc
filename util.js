
module.exports = {
    uuidv4() {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
            (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
        );
    },
    bodyParserUrl(req, _, next) {
        req.on('data', data => {
            if (!req.body) req.body = {};
            const [key, ...valueRaw] = data.toString().split('=');
            req.body[key] = decodeURIComponent(valueRaw.join('='));
        });
        req.on('end', () => {
            next();
        });
    }

}
