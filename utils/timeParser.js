module.exports = {
    parseDuration(durationString) {
        const timeUnits = {
            s: 1000, // milliseconds
            m: 1000 * 60,
            h: 1000 * 60 * 60,
            d: 1000 * 60 * 60 * 24,
            w: 1000 * 60 * 60 * 24 * 7,
        };

        const regex = /(\d+)([smhdw])/g;
        let totalMilliseconds = 0;
        let match;

        while ((match = regex.exec(durationString)) !== null) {
            const value = parseInt(match[1]);
            const unit = match[2];
            if (timeUnits[unit]) {
                totalMilliseconds += value * timeUnits[unit];
            }
        }

        return totalMilliseconds;
    },
};
