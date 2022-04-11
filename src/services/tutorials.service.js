const Repository = require('../repositories');
const Op = require('Sequelize').Op;

const jwt = require('jsonwebtoken');
const { getPrivateKey, getRandomNumber, tutorialTokenSignOptions } = require('../utils/jwttoken');
const { BadRequestException, NotFoundException, InternalServerException, BaseError } = require('../exceptions');

module.exports = class TutorialService {
    constructor(repository = Repository) {
        this.repository = repository;
    }

    async findAll(reqOptions) {
        try {
            const queryOptions = this.buildQueryOptions(reqOptions);
            return await this.repository.Tutorial.findAll(queryOptions);
        } catch (error) {
            if (BaseError.isTrustedError(error)) {
                throw new BadRequestException('Could not retrieve tutorials', error);
            }
            throw new InternalServerException('Somethig went wrong while retrieving requested tutorials', error);
        }
    }

    buildQueryOptions({ filters, sorting, pagination }) {
        const reqOptions = {};

        // Add not null conditions.
        if (filters) reqOptions.filters = filters;
        if (sorting) reqOptions.sorting = sorting;
        if (pagination) reqOptions.pagination = pagination;

        let queryOptions = {};

        queryOptions = this.prepareWhereCondition(queryOptions, reqOptions);
        queryOptions = this.prepareOrderByCondition(queryOptions, reqOptions);
        queryOptions = this.preparePagination(queryOptions, reqOptions);
        queryOptions = this.prepareIncludeCondition(queryOptions);

        return queryOptions;
    }

    prepareIncludeCondition(opt = {}) {
        opt.attributes = { exclude: ['deletedAt', 'userId'] };
        opt.include = [
            {
                model: this.repository.User,
                attributes: ['id', 'first_name', 'last_name', 'email', 'role'],
            },
        ];
        return opt;
    }

    prepareWhereCondition(opt = {}, { filters }) {
        let condition;
        if (filters) {
            const conditionArray = [];

            if (filters.title) conditionArray.push({ title: { [Op.like]: `%${filters.title}%` } });
            if (filters.description)
                conditionArray.push({
                    description: { [Op.like]: `%${filters.description}%` },
                });

            if (conditionArray.length !== 0) {
                if (!filters.condition || filters.condition === 'OR') {
                    condition = { [Op.or]: conditionArray };
                } else if (filters.condition === 'AND') {
                    condition = { [Op.and]: conditionArray };
                }
            }
        }
        if (condition) opt.where = condition;
        return opt;
    }

    prepareOrderByCondition(opt = {}, { sorting }) {
        const order = [];
        if (sorting) {
            order.push(Object.entries(sorting).map(([_, value]) => value));
            opt.order = order;
        }
        return opt;
    }

    preparePagination(opt = {}, { pagination }) {
        if (pagination) {
            opt.limit = pagination.limit;
            opt.offset = pagination.offset;
        }
        return opt;
    }

    async find(id) {
        try {
            const ret = await this.repository.Tutorial.findByPk(id, this.prepareIncludeCondition());
            if (!ret) throw new NotFoundException(`Tutorial with id: ${id} not found`);
            return ret.get();
        } catch (error) {
            if (BaseError.isTrustedError(error)) {
                throw new BadRequestException(`Error while retrieving tutorial with id: ${id}`, error);
            }
            throw new InternalServerException(`Somethig went wrong while retrieving id: ${id}`, error);
        }
    }

    getTutorialCreationToken(timestamp) {
        try {
            const privateKey = getPrivateKey();
            const createdAt = new Date(timestamp).toISOString();
            const payload = {
                timestamp,
                createdAt,
                randomness: getRandomNumber(),
            };
            return jwt.sign(payload, privateKey, tutorialTokenSignOptions());
        } catch (error) {
            if (BaseError.isTrustedError(error)) {
                throw new BadRequestException('Could not create tutorial token', error);
            }
            throw new InternalServerException('Somethig went wrong while creating tutorial creation token', error);
        }
    }

    async create(tutorial, userId) {
        try {
            const ret = await this.repository.Tutorial.create({
                ...tutorial,
                userId,
                video_url: tutorial.videoUrl,
                published_status: 'PENDING',
            });
            return ret.get();
        } catch (error) {
            if (BaseError.isTrustedError(error)) {
                throw new BadRequestException('Requested tutorial could not be created', error);
            }
            throw new InternalServerException(`Somethig went wrong while creating tutorial`, error);
        }
    }

    async update(tutorial, id) {
        try {
            const ret = await this.repository.Tutorial.update(tutorial, { where: { id } });
            return ret.get();
        } catch (error) {
            if (BaseError.isTrustedError(error)) {
                throw new BadRequestException(`Requested tutorial could not be updated tutorialId=${id}`, error);
            }
            throw new InternalServerException(`Somethig went wrong while updating tutorialId=${id}`, error);
        }
    }

    async delete(id, userId) {
        try {
            const count = await this.repository.Tutorial.destroy({ where: { id, userId } });
            if (count === 1) return `Tutorial with id: ${id} was deleted successfully`;
            else return `No deletion occurred`;
        } catch (error) {
            if (BaseError.isTrustedError(error)) {
                throw new BadRequestException(`Could not delete tutorial with id: ${id}`, error);
            }
            throw new InternalServerException(`Somethig went wrong while deleting tutorialId=${id}`, error);
        }
    }

    async deleteAllByUser(userId) {
        try {
            const count = await this.repository.Tutorial.destroy({
                where: { userId },
                truncate: false,
            });
            if (count === 1) return `Tutorial with id: ${id} was deleted successfully`;
            else return `No deletion occurred`;
        } catch (error) {
            if (BaseError.isTrustedError(error)) {
                throw new BadRequestException(`Could not delete tutorials for user: ${userId}`, error);
            }
            throw new InternalServerException(`Somethig went wrong while deleting for user: ${userId}`, error);
        }
    }
};
