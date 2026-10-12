# Artwork attribution

The thermometer artwork is adapted from two icons on [SVG Repo](https://www.svgrepo.com). Both were uploaded by SVG Repo and are released under [CC0 1.0](https://www.svgrepo.com/page/licensing/#CC0) (public domain), so attribution is optional. It is given here to record where the artwork came from.

| Icon | Source | License | Used for |
| --- | --- | --- | --- |
| Thermometer | [svgrepo.com/svg/37604/thermometer](https://www.svgrepo.com/svg/37604/thermometer) (also listed as [#146701](https://www.svgrepo.com/svg/146701/thermometer)) | CC0 | Backdrop circle, glass, bore, bulb, ticks, highlight, °C glyph |
| Fahrenheit | [svgrepo.com/svg/22344/fahrenheit-meausre](https://www.svgrepo.com/svg/22344/fahrenheit-meausre) (also listed as [#4386](https://www.svgrepo.com/svg/4386/fahrenheit-meausre)) | CC0 | °F glyph |

The unmodified source files are kept in [`art/source/`](./art/source).

## Changes from the source icons

- Extended the mercury bore from y=195.374 to y=94, so the column can travel the full tube.
- Turned the mercury into a clip path filled by a moving rectangle.
- Combined the two icons and made the unit glyph switchable.
- Replaced the hard-coded fills with CSS custom properties that have light and dark defaults.
