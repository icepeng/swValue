$(document).ready(function(){$("body").append('<div id="toTop"><img src="/img/toTop.png" width="50" height="50"></div>'),$("#toTop").bind("click",function(){$("body").animate({scrollTop:0},200)}),$(window).scroll(function(){0!=$(this).scrollTop()?$("#toTop").fadeIn():$("#toTop").fadeOut()})});