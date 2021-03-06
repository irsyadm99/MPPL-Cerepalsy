const PostModel = require('../model/post')
const CommentModel = require('../model/comment')
const constant = require('../constant')

exports.index = async (req, res) => {

    const { populateUser } = req.query

    const posts = await PostModel.find({ archived: false })
        .populate(...(populateUser == 'true' ? ['userId', 'name'] : ['']))
        .lean()

    return res.status(200).json({
        posts
    })
}

exports.post = async (req, res) => {

    const { id } = req.params
    const { populateUser } = req.query

    const post = await PostModel.findById(id)
        .populate(...(populateUser == 'true' ? ['userId', 'name'] : ['']))
        .lean()

    if (!post) {
        return res.status(404).json({
            message: "post not found",
        })
    }

    const comments = await CommentModel.find({
        postId: id
    }).select('text date userId').lean()

    return res.status(200).json({
        post,
        comments
    })
}

exports.withComment = async (_req, res) => {

    const { auth } = res.locals
    // console.log(auth)

    const posts = await PostModel.aggregate([{
        $match: {
            archived: false
        }
    }, {
        $lookup: {
            from: constant.collection.COMMENT,
            localField: "_id",
            foreignField: "postId",
            as: "comments"
        },
    }, {
        $unwind: {
            path: "$comments",
            preserveNullAndEmptyArrays: true,
        }
    }, {
        $sort: { "comments.date": -1 }
    }, {
        $lookup: {
            from: constant.collection.USER,
            localField: "comments.userId",
            foreignField: "_id",
            as: "comments.user"
        },
    }, {
        $unwind: {
            path: "$comments.user",
            preserveNullAndEmptyArrays: true,
        }
    }, {
        $group: {
            _id: "$_id",
            text: { $first: "$text" },
            date: { $first: "$date" },
            userId: { $first: "$userId" },
            upvote: { $first: "$upvote" },
            downvote: { $first: "$downvote" },
            comments: { $push: "$comments" }
        }
    }, {
        $lookup: {
            from: constant.collection.USER,
            localField: "userId",
            foreignField: "_id",
            as: "user"
        },
    }, {
        $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
        }
    }, {
        $project: {
            text: 1,
            date: 1,
            // comments: {
            //     $filter: { input: "$comments", as: "a", cond: { $ifNull: ["$$a._id", false] } }
            // },
            'comments._id': 1,
            'comments.text': 1,
            'comments.date': 1,
            // 'comments.userId': 1,
            'comments.user.name': 1,
            'comments.user._id': 1,
            sum_upvote: { $cond: { if: { $isArray: "$upvote" }, then: { $size: "$upvote" }, else: 0 } },
            sum_downvote: { $cond: { if: { $isArray: "$downvote" }, then: { $size: "$downvote" }, else: 0 } },
            'user._id': 1,
            'user.name': 1,
            'upvoted': {
                $in: [auth, "$upvote"]
            },
            'downvoted': {
                $in: [auth, "$downvote"]
            },
        }
    }, {
        $sort: { date: -1 }
    },])

    return res.status(200).json({
        // auth,
        posts
    })
}

exports.myPost = async (req, res) => {

    const { isArchived } = req.params

    const filter = {
        userId: res.locals.auth,
        archived: (isArchived == 'true' ? true : false)
        // ...(isArchived ? { archived: (isArchived == 'true' ? true : false ) } : {})
    }

    const posts = await PostModel.find(filter).lean()

    return res.status(200).json({
        posts
    })
}

exports.create = async (req, res) => {

    const { text } = req.body

    const post = await PostModel.create({
        text,
        date: new Date(),
        userId: res.locals.auth
    })

    return res.status(201).json({
        post
    })

}

exports.update = async (req, res) => {

    const { id } = req.params
    const { text } = req.body

    const post = await PostModel.findById(id)
    if (!post) {
        return res.status(404).json({
            message: "post not found"
        })
    }

    // if (String(post.userId) != String(res.locals.auth)) {
    //     return res.status(403).json({
    //         message: 'tidak ada izin'
    //     })
    // }

    post.text = text
    await post.save()

    return res.status(201).json({
        post
    })

}

exports.delete = async (req, res) => {

    const { id } = req.params

    const post = await PostModel.findOne({ _id: id, archived: false })

    if (!post) {
        return res.status(404).json({
            message: "post not found"
        })
    }

    // if (String(post.userId) != String(res.locals.auth)) {
    //     return res.status(403).json({
    //         message: 'tidak ada izin'
    //     })
    // }

    post.archived = true
    await post.save()

    return res.status(200).json({
        message: "deleted",
        post
    })
}

exports.restore = async (req, res) => {

    const { id } = req.params

    const post = await PostModel.findOne({ _id: id, archived: true })

    if (!post) {
        return res.status(404).json({
            message: "post not found"
        })
    }

    // if (String(post.userId) != String(res.locals.auth)) {
    //     return res.status(403).json({
    //         message: 'tidak ada izin'
    //     })
    // }

    post.archived = false
    await post.save()

    return res.status(200).json({
        message: "restored",
        post
    })
}

exports.upvote = async (req, res) => {
    const { id } = req.params

    const post = await PostModel.findByIdAndUpdate(id, {
        $addToSet: { upvote: res.locals.auth },
        $pullAll: { downvote: [res.locals.auth] }
    }, { new: true })

    if (!post)
        return res.status(404).json({
            message: "post not found"
        })

    return res.status(200).json({
        id,
        post,
    })
}

exports.downvote = async (req, res) => {
    const { id } = req.params

    const post = await PostModel.findByIdAndUpdate(id, {
        $addToSet: { downvote: res.locals.auth },
        $pullAll: { upvote: [res.locals.auth] }
    }, { new: true })

    if (!post)
        return res.status(404).json({
            message: "post not found"
        })

    return res.status(200).json({
        id,
        post,
    })
}

exports.novote = async (req, res) => {
    const { id } = req.params

    const post = await PostModel.findByIdAndUpdate(id, {
        $pullAll: { upvote: [res.locals.auth], downvote: [res.locals.auth] }
    }, { new: true })

    if (!post)
        return res.status(404).json({
            message: "post not found"
        })

    return res.status(200).json({
        id,
        post,
    })
}