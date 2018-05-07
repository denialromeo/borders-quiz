push:
ifeq ($(m),)
	@echo usage: make m='"Your commit message."'
else
	git add --all .
	git commit -m "$(m)"
	git push
endif

l:
	jekyll serve --port 4000