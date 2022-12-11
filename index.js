const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

const Posts = require("./Posts.js");

mongoose
  .connect(
    "mongodb+srv://root:<password>@newscluster.6tn6bcu.mongodb.net/portalNews?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    console.log(`Conectado com sucesso ao mongoDB`);
  })
  .catch((err) => {
    console.log(err.message);
  });

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.use("/public", express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "/pages"));
app.listen(3000, () => {
  console.log("Servidor iniciado!");
});

app.get("/", (req, res) => {
  console.log(req.query);

  if (req.query.busca == null) {
    Posts.find({})
      .sort({ _id: -1 })
      .exec(function (err, posts) {
        //console.log(posts[0]);
        posts = posts.map((val) => {
          return {
            titulo: val.titulo,
            conteudo: val.conteudo,
            descricaoCurta: val.conteudo.substr(0, 200),
            descricaoToMoreRead: val.conteudo.substr(0, 100),
            imagem: val.imagem,
            slug: val.slug,
            categoria: val.categoria,
          };
        });

        Posts.find({})
          .sort({ views: -1 })
          .limit(3)
          .exec(function (err, postsTop) {
            // console.log(posts[0]);

            postsTop = postsTop.map(function (val) {
              return {
                titulo: val.titulo,
                conteudo: val.conteudo,
                descricaoCurta: val.conteudo.substr(0, 100),
                imagem: val.imagem,
                slug: val.slug,
                categoria: val.categoria,
                views: val.views,
              };
            });

            res.render("home", { posts: posts, postsTop: postsTop });
          });
      });
  } else {
    Posts.find({ titulo: { $regex: req.query.busca, $options: "i" } }).exec(
      (err, posts) => {
        posts = posts.map((val) => {
          return {
            titulo: val.titulo,
            conteudo: val.conteudo,
            descricaoCurta: val.conteudo.substr(0, 300),
            imagem: val.imagem,
            slug: val.slug,
            categoria: val.categoria,
          };
        });
        res.render("busca", { posts: posts, contagem: posts.length });
      }
    );
  }
});

app.get("/:slug", (req, res) => {
  Posts.findOneAndUpdate(
    { slug: req.params.slug },
    { $inc: { views: 1 } },
    { new: true },
    (err, resposta) => {
      if (resposta != null) {
        Posts.find({})
          .sort({ views: -1 })
          .limit(3)
          .exec(function (err, postsTop) {
            // console.log(posts[0]);

            postsTop = postsTop.map(function (val) {
              return {
                titulo: val.titulo,
                conteudo: val.conteudo,
                descricaoCurta: val.conteudo.substr(0, 100),
                imagem: val.imagem,
                slug: val.slug,
                categoria: val.categoria,
                views: val.views,
              };
            });
            res.render("single", { noticia: resposta, postsTop: postsTop });
          });
      } else {
        res.redirect("/");
      }
    }
  );
});

app.get("/", (req, res) => {
  res.send("HOME");
});
