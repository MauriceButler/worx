# worx

Worx is a development helper for working with [Blackberry 10 Webworks](http://developer.blackberry.com/html5/).  Normally when developing with Webworks you are encouraged to either use the Momentics IDE or Ripple to construct application packages and install then onto a device.  While either approach is satisfactory, I really would prefer to work with a command-line process.  The good news is that the Webworks SDK does come with some excellent command-line tooling, but it gets annoying trying to remember all the required commands.  This is where worx can help you out :)

## Getting Started

The first thing to do is install worx, which does require that you have node and npm installed:

```
npm install -g worx
```

Once you have done this, you should be able to type `worx --version` and get at least some output.  Now, it's configuration time.

Let's start by telling worx where you have installed the Webwork SDK.  I'm living life on the edge at the moment, so I'm using the [BB10-Webworks-Packager](https://github.com/blackberry/BB10-Webworks-Packager) that the Blackberry team publish on Github:

```
worx config-set ~/code/github/BB10-Webworks-Packager
```

If you have installed by another means (then just look for the directory that contains the `bbwp` or `bbwp.bat` files) and supply that path.