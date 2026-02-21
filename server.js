const express = require('express');
const app = express();

app.use(express.json());

const userRoutes = require('./routes/userRoutes');

app.use('/users', userRoutes);

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
