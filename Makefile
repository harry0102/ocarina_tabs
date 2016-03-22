FONTS=Open-12-Hole-Ocarina-1.ttf Open-12-Hole-Ocarina-2.ttf

.PHONY: all clean

all: $(FONTS)

%.ttf: %.svg X.svg make_font.py
	./make_font.py $< $@

clean:
	rm -v $(FONTS)
