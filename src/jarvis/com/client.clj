(ns jarvis.com.client
  (:require [net.tcp.server :as s]
            [jarvis.com.server :refer [read-port]])
  (:import [java.net Socket]
           [java.io BufferedReader BufferedWriter]))

(defn print-handler
  [^String content ^BufferedReader reader ^BufferedWriter writer]
  (.append writer "Hello my friend\nThis is a nice day\n")
  (.append writer content)
  (.append writer "\n")
  (.flush writer)
  (loop []
    (when-not (.ready reader)
      (Thread/sleep 10)
      (recur)))
  (loop []
    (when (.ready reader)
      (println (str "< " (.readLine reader)))))
  (println "-- end --"))

(defn send-msg
  ([content]
   (send-msg (read-port) content))
  ([port content]
   (let [^String host "localhost"]
     (with-open [socket (Socket. host port)]
       (let [handler (s/wrap-io (partial print-handler content))]
         (handler socket))))))

(comment
  (def content "test")
  (def port (read-port))
  (send-msg "this is my content")
  
  )

