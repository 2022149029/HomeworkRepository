const express = require('express');
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');

const app = express();
app.use(express.urlencoded({ extended: false }));

const fs = require("fs").promises;

app.use(express.static("public"));
app.use(express.json());

async function getDBConnection() {
    const db = await sqlite.open({
        filename: 'product.db',
        driver: sqlite3.Database
    });
    return db;
}

async function readJson(fileName) {
    let contents = await fs.readFile(fileName, "utf8");
    return JSON.parse(contents);
}

app.get('/', async function(req, res) {
    let inner = await load(req.query.search, req.query.category, req.query.sort);
    let template = `
    <!--index.html-->
    <!DOCTYPE html>

    <html lang="en">
        <head>
            <meta charset="utf-8">
            <link rel="stylesheet" type="text/css" href="/main.css">
            <link href="https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
            <title>Shop</title>
        </head>
        <body>
            <header class="header movingheader">
                <h1><a href="/">Internet Programming Shop</a></h1>
            </header>
            <div class="nav">
                <div class="navItem"><a href="/login" class="navLink">Login</a></div>
                <div class="navItem"><a href="/signup" class="navLink">Sign Up</a></div>
            </div>
            <div class="main_content">
                <form class="filter_content" method="GET">
                    <p>
                        <label>Search:
                            <input id="search" name = "search" type="search" placeholder="Search">
                        </label>
                    </p>
                    <p>
                        <label>Select Category:
                            <select id="category" name = "category">
                                <option selected>All</option>
                                <option>C++</option>
                                <option>Java</option>
                                <option>Python</option>
                                <option>HTML/CSS</option>
                                <option>JS</option>
                            </select>
                        </label>
                    </p>
                    <p>
                        <label>Choose a sort:
                            <select id="sort" name = "sort">
                                <option selected>none</option>
                                <option>By Title</option>
                                <option>By Price</option>
                            </select>
                        </label>
                    </p>
                    <p>
                        <button id="filterLoad" onclick="filterLoad()">Filter</button>
                    </p>
                </form>
                <div class="products_content">${inner}</div>
            </div>
            <footer>
                <h6>CSI2109-01, 2023 Spring<br>2022149029 Heechan Choi</h6>
            </footer>
            <script>
                function itemclick(product_id) {
                    location.href="/product/" + product_id;
                }
            </script>
        </body>
    </html>
    `;
    res.send(template);
})

async function load(search, category, sort) {
    let inner = "";
    let db = await getDBConnection();
    let products;
    let dbcmd = "SELECT * FROM Product";
    if (search || (category != "All" && category != undefined)) {
        dbcmd += " WHERE";
        if (search) {
            dbcmd += " product_title LIKE '%" +search + "%'";
            if (category != "All" && category != undefined) dbcmd += " AND";
        }
        if (category != "All" && category != undefined) {
            dbcmd += " product_category = '" + category + "'";
        }
    }
    if (sort != "none" && sort != undefined) {
        dbcmd += " ORDER BY";
        if (sort == "By Title") {
            dbcmd += " product_title";
        } else if (sort == "By Price") {
            dbcmd += " product_price";
        }
    }
    dbcmd += ";";
    products = await db.all(dbcmd);
    await db.close();
    for (let i = 0; i < products.length; i++) {
        inner += "<div class='product' onclick='itemclick(" + products[i].product_id + ")'>";
        inner += '<div class="imglist">';
        inner += '<div class="subimg">';
        if (products[i].product_category == "C++") {
            inner += '<img src="images/cpp.jpg" alt="c++">';
        } else if (products[i].product_category == "Java") {
            inner += '<img src="images/java.jpg" alt="java">';
        } else if (products[i].product_category == "Python") {
            inner += '<img src="images/python.jpg" alt="java">';
        } else if (products[i].product_category == "HTML/CSS") {
            inner += '<img src="images/html.jpg" alt="java">';
        } else if (products[i].product_category == "JS") {
            inner += '<img src="images/javascript.jpg" alt="java">';
        } else {
            inner += '<img src="images/book.png" alt="book">';
        }
        inner += '</div>';
        inner += '<div class="img">';
        inner += '<img src="/images/' + products[i].product_image + '" alt="' + products[i].product_image + '">';
        inner += '<div></div>';
        inner += '</div>';
        inner += '</div>';
        inner += '<div class="product_text">';
        inner += '<ul>';
        inner += '<li>' + products[i].product_name + '</li>';
        inner += '<li> By ' + products[i].product_author + '</li>';
        inner += '<li>$ ' + products[i].product_price + '</li>';
        inner += '</ul>';
        inner += '</div>';
        inner += '</div>';
    }
    return inner
}

app.get('/product/:product_id', async function(req, res) {
    let db = await getDBConnection();
    let product;

    let template;
    if (req.params.product_id) product = await db.all("SELECT * FROM Product WHERE product_id = " + req.params.product_id);

    if (product[0]) { 
        let reviews = await getReview(product[0].product_id);
        let table_inner = "<tbody>";
        if (reviews != null) {
            for (r of reviews.data) {
                table_inner += "<tr><td>" + r + "</td></tr>";
            }
        }
        table_inner += "</tbody>"

        if (product[0].product_category == "C++") {
            subimg_src = 'images/cpp.jpg';
        } else if (product[0].product_category == "Java") {
            subimg_src = 'images/java.jpg';
        } else if (product[0].product_category == "Python") {
            subimg_src = 'images/python.jpg';
        } else if (product[0].product_category == "HTML/CSS") {
            subimg_src = 'images/html.jpg';
        } else if (product[0].product_category == "JS") {
            subimg_src = 'images/javascript.jpg';
        } else {
            subimg_src = 'images/book.jpg';
        }
        template = `
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <link href="https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
            <link rel="stylesheet" type="text/css" href="/main.css">
            <title>Shop</title>
        </head>
        <body>
            <header class="header">
                <h1><a href="/">Internet Programming Shop</a></h1>
            </header>
            <div class="nav">
                <div class="navItem"><a href="/login" class="navLink">Login</a></div>
                <div class="navItem"><a href="/signup" class="navLink">Sign Up</a></div>
            </div>
            <div class="description_content">
                <div class="description_img"> 
                    <img src="/images/${product[0].product_image}" alt="${product[0].product_title}">
                </div>
                <div class="description">
                    <p class="ph3">(product id: ${product[0].product_id})</p>
                    <p class="ph1">${product[0].product_title}</p>
                    <p class="ph2">$${product[0].product_price}</p>
                    <p class="ph3">By ${product[0].product_author}</p>
                    <p class="ph3">Category: ${product[0].product_category}</p>
                </div>
                <div class="reviewDiv">
                    <p> 리뷰 </p>
                    <table id="reviewTable">
                        ${table_inner}
                    </table>
                    <form method="post" action="/addreview" target="iframe1">
                        <input type="hidden" name="product_id" value=${product[0].product_id}>
                        <input name="review" type="text" placholder="addreview">
                        <input type="submit" value="submit">
                    </form>
                    <iframe id="iframe1" name="iframe1" style="display:none"></iframe>
                </div>
            </div>
            <footer>
                <h6>CSI2109-01, 2023 Spring<br>2022149029 Heechan Choi</h6>
            </footer>

        </body>
        </html> 
        `
        res.send(template);
    } else res.send("Cannot find product");
})

app.get('/login', (req, res) => {
    let template = 
    `
    <!DOCTYPE html>
    <!-- login.html -->
    <html lang="en">
        <head>
            <meta charset="utf-8">
            <link rel="stylesheet" type="text/css" href="/main.css">
            <link href="https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
            <title>Shop</title>
        </head>
        <body>
            <header class="header">
                <h1><a href="/">Internet Programming Shop</a></h1>
            </header>
            <div class="nav">
                <div class="navItem"><a href="/login" class="navLink">Login</a></div>
                <div class="navItem"><a href="/signup" class="navLink">Sign Up</a></div>
            </div>
            <div class="main_content">
                <div class="signFormDiv">
                    <form method="POST" class="signForm">
                        <p>
                            <label><strong>ID</strong><br>
                                <input name = "id" type = "text" autofocus size="10" maxlength="20" required class="textInput">
                            </label>
                        </p>
                        <p>
                            <label><strong>Password</strong> <br>
                                <input name = "pwd" type = "password" required class="textInput">
                            </label>
                        </p>
                        <input id="loginBtn" class="btn" type="submit" value="Login">
                    </form>
                </div>
            </div>
            <footer>
                <h6>CSI2109-01, 2023 Spring<br>2022149029 Heechan Choi</h6>
            </footer>
        </body>
    </html>
    `;
    res.send(template);
});

async function addReview(product_id, review) {
    if (!review) return;
    let commentfile = await fs.readFile('comment.json', 'utf8');
    let comments = JSON.parse(commentfile)
    let find = false;
    for (let i = 0; i < comments.length; i++) {
        if (comments[i].product_id == product_id) {
            comments[i].data[comments[i].data.length] = review;
            find = true;
            break;
        }
    }
    if (!find) {
        comments[comments.length] = {product_id: product_id, data: [review]};
    }
    await fs.writeFile('comment.json', JSON.stringify(comments), 'utf-8');
}

async function getReview(product_id) {
    let commentfile = await fs.readFile('comment.json', 'utf8');
    let comments = await JSON.parse(commentfile);
    for (let i = 0; i < comments.length; i++) {
        if (comments[i].product_id == product_id) {
            return comments[i];
        }
    }
    return null;
}

app.post("/addreview", async function(req, res) {
    const item = req.body;
    
    if (item.review) {
        addReview(item.product_id, item.review); 
        res.sendStatus(200);
    } else {
        res.sendStatus(400);
    }
})

app.get('/signup', (req, res) => {
    let template = 
    `
    <!DOCTYPE html>
<!-- signup.html-->
<html lang="en">
    <head>
        <meta charset="utf-8">
        <link rel="stylesheet" type="text/css" href="/main.css">
        <link href="https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">       
        <title>Shop</title>
    </head>
    <body>
        <header class="header">
            <a href="/"><h1>Internet Programming Shop</h1></a>
        </header>
        <div class="nav">
            <div class="navItem"><a href="/login" class="navLink">Login</a></div>
            <div class="navItem"><a href="/signup" class="navLink">Sign Up</div>
        </div>
        <div class="main_content">
            <div class="signFormDiv">
                <form method="POST" class="signForm">
                    <p>
                        <label><strong>Your name</strong> <br><input class="textInput" name = "id" type = "text" placeholder="Enter your name" autofocus required autocomplete="on"><br></label>
                        <label class="notice">* required</label>
                    </p>
                    <p>
                        <label><strong>Gender</strong></label>
                        <label class="notice">&nbsp;* required<br></label>
                        <input name = "gender" type = "radio" value = "male" checked>&nbsp;Male&nbsp;&nbsp;
                        <input name = "gender" type = "radio" value = "female" >&nbsp;Female&nbsp;&nbsp;
                        <input name = "gender" type = "radio" value="notresponse" >&nbsp;No Response
                    </p>
                    <p>
                        <label><strong>Age</strong><br> <input class="intInput" name="age" type="number" step="1" max="100" min="1" value="20"></label>
                    </p>
                    <p>
                        <label><strong>Birth</strong><br> <input class="dateInput" name="birthday" type="date"></label>
                    </p>
                    <p>
                        <label><strong>Email Address</strong> <br><input class="textInput" name="email" type="email" placeholder = "email@example.com" autocomplete="on"></label>
                    </p>
                    <p>
                        <label><strong>Tel</strong> <br><input class="textInput" name="tel" type="tel" placeholder = "###-####-####" pattern = "[0-9]{3}-[0-9]{4}-[0-9]{4}" ></label>
                    </p>
                    <p>
                        <label><strong>ID</strong> <br><input class="textInput" name="id" type="text" maxlength = "20" size = "20" placeholder="Your ID" required autocomplete="on"><br></label>
                        <label class="notice">* required, within 20 characters</label>
                    </p>
                    <p>
                        <label><strong>Password </strong><br><input class="textInput" name="passwd" type="password" placeholder="Your password" required><br> </label>
                        <label class="notice">* required</label>
                    </p>
                    <p>
                        <label><strong>Password Check</strong> <br><input class="textInput" name="chkpasswd" type="password" placeholder="Enter your password again" required><br></label>
                        <label class="notice">* required</label>
                    </p>
                    <p>
                        <label><strong>Your Interests</strong><br></label>
                        <input name = "liked" type = "checkbox" value = "it">&nbsp;IT Devices&nbsp;&nbsp; 
                        <input name = "liked" type = "checkbox" value = "clothes">&nbsp;Clothes&nbsp;&nbsp; 
                        <input name = "liked" type = "checkbox" value = "food">&nbsp;Foods
                    </p>
                    <p>
                        <input id="signupBtn" class="btn" type = "submit" value="Sign Up">
                        <input id="cancelBtn" class="btn" type = "submit" formnovalidate value="Cancel" >
                    </p>
                </form>
            </div>
        </div>
        <footer>
            <h6>CSI2109-01, 2023 Spring<br>2022149029 Heechan Choi</h6>
        </footer>
    </body>
</html>

    `;
    res.send(template);
});

app.get('/getitem', async function(req, res) {
    let db = await getDBConnection();
    return await db.all('SELECT * FROM Product');
});

app.get('/load', async function(req, res) {
    let db = await getDBConnection();
    let product = await readJson('product.json');
    for (let i = 0; i < product.length; i++) {
        await db.run("INSERT INTO Product (product_image, product_title, product_price, product_category, product_author) VALUES ('" +
            product[i].IMAGE + "', '" + product[i].NAME + "', " + product[i].PRICE + ", '" + product[i].CATEGORY + "', '" + product[i].AUTHOR + "');")
    }
    await db.close();
    res.send("finished");
});

const PORT = 3000;
app.listen(PORT, function() {
    console.log("Server Start");
});