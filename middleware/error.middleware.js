const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({ 
            message: 'Validation Error', 
            details: err.message 
        });
    }

    res.status(500).json({ 
        message: 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
};

module.exports = errorMiddleware;
