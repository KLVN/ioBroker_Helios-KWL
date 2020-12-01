# Additional scripts for Helios KWL

_[(English instructions)](#English)_

Hier ist eine Sammlung meiner zusätzlichen Skripte für Helios KWL Lüftungsanlagen. Bei Bedarf muss ein Skript nur kopiert, in `helios.js` ganz unten eingefügt und evtl. angepasst werden.

### Zusätzliche Skripte

|        Dateiname         | Beschreibung                                                 |
| :----------------------: | :----------------------------------------------------------- |
| `bathroomVentilation.js` | Nie wieder Schimmel und beschlagene Spiegel!<br />Anhand des Stromverbrauchs wird erkannt, ob derzeit die Dusche benutzt wird. Wurde in den letzten Minuten ein bestimmter Schwellwert (Standard: 6 kW) überschritten, so wird die Lüftung für die nächsten 15 Minuten eingeschaltet.<br />Voraussetzung: Wasser wird mit Durchlauferhitzer erhitzt und der Stromverbrauch im ioBroker aufgezeichnet. |
|      `schedules.js`      | Automatischer Wochenplan, der nächtlich die Lüftung aktiviert. Zusätzlich wird tagsüber die Lüftung 20 Minuten nach der letzten Änderung wieder ausgeschaltet. So wird verhindert, dass die Lüftung ständig läuft, auch wenn sie nicht mehr gebraucht wird. |



## English

This is a collection of additional scripts for your Helios KWL ventilation system. Englisch descriptions and comments are given in the scripts.