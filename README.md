# Neos PDF Reader Backend [WIP]
This is a backend server designed to be used with a PDF reader I created in the [Neos Metaverse](https://neos.com/).
The server takes a url of a PDF (or a file), converts it to PNG, and serve it to the PDF reader.

The server works by taking in a PDF file, converts it using `pdftoppm` command, then serve the images converted. Upon completion of conversion, the server will respond with emap, which is a format that can be used in NeosVR.

The Neos side will accept the emap, converts it to variables, then access the images from the server according to the data in the emap received.
![./preview.jpg](preview)
