const returnResponse = (
    req,
    res,
    {
        code = 200,
        status = "success",
        success = true,
        message = "Success",
        data = null,
        debug = null,
    } = {}
) => {
    const response = {
        code,
        status,
        success,
        message,
        data,
        timestamp: Math.floor(Date.now() / 1000),
        method: req?.method || null,
        endpoint: req?.originalUrl || req?.path || null,
    };

    if (debug !== null) {
        response.debug = debug;
    }

    return res.status(code).json(response);
};

module.exports = returnResponse;
