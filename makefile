push:
	git add --all .
ifeq ($(m),)
	git commit -m "Updated game to latest version."
else
	git commit -m "$m"
endif
	git push

l:
	jekyll serve --port 4000