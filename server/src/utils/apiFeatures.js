class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = { ...this.queryString };

        const excludedFields = [
            "page",
            "sort",
            "limit",
            "fields"
        ];

        excludedFields.forEach(el => delete queryObj[el]);

        let queryStr = JSON.stringify(queryObj);

        queryStr = queryStr.replace(
            /\b(gte|gt|lte|lt)\b/g,
            match => `$${match}`
        );

        this.query = this.query.find(JSON.parse(queryStr));

        return this;
    }

    sort() {
        if (this.queryString.sort) {

            const sortBy =
                this.queryString.sort.split(",").join(" ");

            this.query = this.query.sort(sortBy);

        } else {

            this.query = this.query.sort("-createdAt");

        }

        return this;
    }

    paginate(totalDocuments) {

        const page = parseInt(this.queryString.page) || 1;

        const limit = parseInt(this.queryString.limit) || 10;

        const skip = (page - 1) * limit;

        this.pagination = {
            currentPage: page,
            limit,
            totalPages: Math.ceil(totalDocuments / limit),
            totalDocuments
        };

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
    limitFields() {

        if (this.queryString.fields) {

            const excludedFields = [
                'password',
                '__v'
            ];

            const fields = this.queryString.fields
                .split(',')
                .filter(field => !excludedFields.includes(field))
                .join(' ');

            this.query = this.query.select(fields);

        } else {

            this.query = this.query.select('-__v');

        }

        return this;
    }
}



export default APIFeatures;