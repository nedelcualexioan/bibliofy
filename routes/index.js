module.exports = (passport) => {
    const {Router: expressRouter} = require("express");

    const router = expressRouter();
    
    const authRouter = require("./authRoutes")(passport);
    const bookRouter = require("./bookRoutes");
    const productRouter = require("./productRoutes");
    
    router.use("/auth", authRouter);
    router.use("/books", bookRouter);
    router.use("/book", productRouter);

    return router;
}