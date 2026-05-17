import multer from "multer";
import path from "path";
import AppError from "../utils/appError.js";

const storage = multer.diskStorage({

    destination(req, file, cb) {
        cb(null, "uploads/");
    },

    filename(req, file, cb) {

        const uniqueName =
            `${Date.now()}-${file.originalname.replace(/\s/g, "-")}`;

        cb(null, uniqueName);
    }

});

const fileFilter = (req, file, cb) => {

    const fileTypes = /jpg|jpeg|png|webp/;

    const extname = fileTypes.test(
        path.extname(file.originalname).toLowerCase()
    );

    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {

        cb(null, true);

    } else {

        cb(
            new AppError(
                "Images only (jpg, jpeg, png, webp)",
                400
            ),
            false
        );

    }
};

const upload = multer({

    storage,

    fileFilter,

    limits: {
        fileSize: 2 * 1024 * 1024
    }

});

export default upload;
