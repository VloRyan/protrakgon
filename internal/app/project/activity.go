package project

import (
	"encoding/json"
	"fmt"
	"strings"
)

type Activity int

const (
	ActivityWork Activity = iota
	ActivityBreak
)

func (a Activity) MarshalJSON() ([]byte, error) {
	switch a {
	case ActivityWork:
		return []byte(`"work"`), nil
	case ActivityBreak:
		return []byte(`"break"`), nil
	default:
		return nil, fmt.Errorf("unknown activity: %d", a)
	}
}

func (a *Activity) UnmarshalJSON(data []byte) (err error) {
	var text string
	if err := json.Unmarshal(data, &text); err != nil {
		return err
	}
	switch strings.ToLower(text) {
	case "work":
		*a = ActivityWork
	case "break":
		*a = ActivityBreak
	default:
		return fmt.Errorf("unknown activity: %s", text)
	}
	return nil
}
