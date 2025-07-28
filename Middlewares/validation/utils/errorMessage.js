function joiErrorMessage(error) {
    // If validation fails, this will catch the error, format the error messages and send a 400 response
    console.log(error.details.email)
    // const errorMessage = error.details
    //     .map((detail) => detail.message)

    
    const groupedMessages = error.details.reduce((acc, error) => {
        // initlially start with {} called acc, in the 2nd para of .reduce(func(), {})
        /*
        details: [
            ...,
            {
                message: 'Role is required',
                path: [ 'role' ],
                type: 'any.required',
                context: { label: 'role', key: 'role' }
            },...
        ]
        */
        const key = error.path[0]//.join('.'); (ex: 'role', 'email')

        // if not acc =  {role: []}, then make it 
        // acc['role'] = []
        // acc['role'].push(error.message)
        if (!acc[key]) acc[key] = [];
        acc[key].push(error.message);
        return acc;
        }, {});

    return groupedMessages
    
}


module.exports = {
    joiErrorMessage,
}