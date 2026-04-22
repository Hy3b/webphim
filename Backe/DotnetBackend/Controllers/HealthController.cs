using Microsoft.AspNetCore.Mvc;

namespace WebPhimApi.Controllers
{
    [ApiController]
    [Route("")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public string Get()
        {
            return "hello";
        }
    }
}
