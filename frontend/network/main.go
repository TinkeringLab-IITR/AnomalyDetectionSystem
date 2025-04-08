package main

import(
	"log"
	"network/controllers"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	
)

func main(){

	router :=gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:		[]string{"*"},
		AllowMethods:		[]string{"GET","POST","PUT","PATCH","DELETE","OPTIONS"},
	}))

	router.GET("/",controllers.Home)

	if err:= router.Run(":8080");err !=nil{
		log.Fatal("Failed to start server")
	}

}