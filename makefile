ifeq ($(m),)
	m='Updated game to latest version.'
endif

push:
	git add --all .
	git commit -m "$m"
	git push

l:
	jekyll serve --port 4000