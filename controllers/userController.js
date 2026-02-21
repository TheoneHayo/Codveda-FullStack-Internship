let users = [
    { id: 1, name: "Hasan", email: "hasan@example.com" }
];

exports.getUsers = (req, res) => {
    res.status(200).json(users);
};

exports.getUserById = (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
};

exports.createUser = (req, res) => {
    const newUser = {
        id: users.length + 1,
        name: req.body.name,
        email: req.body.email
    };
    users.push(newUser);
    res.status(201).json(newUser);
};

exports.updateUser = (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    res.status(200).json(user);
};

exports.deleteUser = (req, res) => {
    const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
    if (userIndex === -1) {
        return res.status(404).json({ message: "User not found" });
    }

    users.splice(userIndex, 1);
    res.status(200).json({ message: "User deleted successfully" });
};
