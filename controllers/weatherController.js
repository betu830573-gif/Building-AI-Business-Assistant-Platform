const axios = require('axios');

exports.getWeather = async (req, res) => {
    try {
        const { location } = req.body;
        if (!process.env.WEATHER_API_KEY) {
            return res.status(500).json({ error: 'Weather API key is not configured.' });
        }

        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${process.env.WEATHER_API_KEY}&units=metric`;
        const response = await axios.get(url);
        
        res.json({ weather: response.data });
    } catch (error) {
        console.error('Error fetching weather:', error);
        res.status(500).json({ error: 'Failed to fetch weather data.' });
    }
};
