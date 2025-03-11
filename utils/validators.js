const validators = {
    validateEmail: (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    validatePassword: (password) => {
        return password.length >= 6;
    }
};
