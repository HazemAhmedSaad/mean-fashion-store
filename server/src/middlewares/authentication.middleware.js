import jwt from 'jsonwebtoken';
import User from '../models/userModel';
export const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized, Invalid token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_key);

        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({ message: 'The user of this token is no longer exists' });
        }
        req.user = currentUser;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid or Expired token' });
    }
};

