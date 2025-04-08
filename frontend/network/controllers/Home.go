package controllers
import(
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
)

func Home(c *gin.Context){
	fmt.Println("hello");
	c.JSON(http.StatusOK,gin.H{
		"message": "Hello from the backend!",
	})
}