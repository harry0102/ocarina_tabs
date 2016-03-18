FONTS=Open-12-Hole-Ocarina-C3.ttf Open-12-Hole-Ocarina-G4.ttf

.PHONY: all clean

all: $(FONTS)

%.ttf: %.svg
	./make_font.py $< $@

clean:
	rm -v $(FONTS)
