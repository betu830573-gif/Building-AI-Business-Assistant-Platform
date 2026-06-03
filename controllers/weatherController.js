// Mock weatherController.js

exports.getWeather = async (req, res) => {
    try {
        const { location } = req.body;
        
        // Mock data that looks like OpenWeatherMap response
        const mockWeatherData = {
            name: location || "Your Village",
            sys: { country: "IN" },
            main: {
                temp: Math.floor(Math.random() * (35 - 20 + 1) + 20), // Random temp between 20 and 35
                humidity: Math.floor(Math.random() * (90 - 40 + 1) + 40),
            },
            weather: [
                { description: "mostly clear skies (dummy data)" }
            ],
            wind: {
                speed: (Math.random() * 5 + 1).toFixed(1)
            }
        };

        // Simulate network delay
        setTimeout(() => res.json({ weather: mockWeatherData }), 1000);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch weather data.' });
    }
};
